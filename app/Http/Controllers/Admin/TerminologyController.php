<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SyncTerminologySource;
use App\Models\TerminologyConcept;
use App\Models\TerminologyMapping;
use App\Models\TerminologySyncJob;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TerminologyController extends Controller
{
    public function index(Request $request): Response
    {
        $query = trim((string) $request->input('q', ''));
        $source = (string) $request->input('source', 'ICD-11');
        $chapter = (string) $request->input('chapter', '');

        $base = TerminologyConcept::query()->forSource($source);

        $paginator = (clone $base)
            ->when($query !== '', fn ($q) => $q->where(function ($sub) use ($query) {
                $like = "%{$query}%";
                $sub->where('code', 'ILIKE', $like)->orWhere('title', 'ILIKE', $like);
            }))
            ->when($chapter !== '', fn ($q) => $q->where('chapter_code', $chapter))
            ->orderBy('code')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (TerminologyConcept $c) => $this->serializeRow($c));

        $chapters = (clone $base)
            ->whereNotNull('chapter_code')
            ->selectRaw('chapter_code, chapter_title, COUNT(*) as count')
            ->groupBy('chapter_code', 'chapter_title')
            ->orderBy('chapter_code')
            ->get()
            ->map(fn ($r) => [
                'code' => $r->chapter_code,
                'title' => $r->chapter_title,
                'count' => (int) $r->count,
            ])
            ->all();

        $sourceDistribution = TerminologyConcept::query()
            ->selectRaw('source, COUNT(*) as count')
            ->groupBy('source')
            ->get()
            ->map(fn ($r) => [
                'name' => $r->source,
                'value' => (int) $r->count,
            ])
            ->all();

        $chapterDistribution = (clone $base)
            ->whereNotNull('chapter_code')
            ->selectRaw('chapter_title, COUNT(*) as count')
            ->groupBy('chapter_title')
            ->orderByDesc('count')
            ->limit(12)
            ->get()
            ->map(fn ($r) => ['name' => $r->chapter_title, 'value' => (int) $r->count])
            ->all();

        $sources = collect(config('terminology.sources', []))->map(fn ($s, $k) => [
            'key' => $k,
            'label' => $s['label'],
            'full_label' => $s['full_label'],
            'description' => $s['description'],
            'icon' => $s['icon'],
            'records_estimate' => $s['records_estimate'],
            'color' => $s['color'],
            'concepts' => TerminologyConcept::forSource($k)->count(),
            'last_sync' => optional(TerminologySyncJob::where('source', $k)
                ->where('status', 'completed')
                ->orderByDesc('completed_at')
                ->first())->completed_at?->toIso8601String(),
            'is_syncing' => TerminologySyncJob::where('source', $k)
                ->whereIn('status', ['queued', 'running'])
                ->exists(),
        ])->values()->all();

        $stats = [
            'total_concepts' => TerminologyConcept::count(),
            'total_sources' => count(config('terminology.sources', [])),
            'total_mappings' => TerminologyMapping::count(),
            'total_chapters' => TerminologyConcept::distinct('chapter_code')->whereNotNull('chapter_code')->count('chapter_code'),
            'last_sync_at' => optional(TerminologySyncJob::where('status', 'completed')
                ->orderByDesc('completed_at')->first())->completed_at?->toIso8601String(),
        ];

        $jobs = TerminologySyncJob::orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (TerminologySyncJob $j) => [
                'id' => $j->id,
                'source' => $j->source,
                'status' => $j->status,
                'concepts_created' => $j->concepts_created,
                'concepts_updated' => $j->concepts_updated,
                'mappings_created' => $j->mappings_created,
                'duration_ms' => $j->duration_ms,
                'error' => $j->error_message,
                'created_at' => $j->created_at->toIso8601String(),
                'completed_at' => $j->completed_at?->toIso8601String(),
            ])
            ->all();

        return Inertia::render('admin/Terminology', [
            'concepts' => $paginator,
            'sources' => $sources,
            'chapters' => $chapters,
            'sourceDistribution' => $sourceDistribution,
            'chapterDistribution' => $chapterDistribution,
            'stats' => $stats,
            'jobs' => $jobs,
            'filters' => ['q' => $query, 'source' => $source, 'chapter' => $chapter],
        ]);
    }

    public function show(string $source, string $code): Response
    {
        $concept = TerminologyConcept::forSource($source)
            ->where('code', $code)
            ->firstOrFail();

        $children = TerminologyConcept::forSource($source)
            ->where('parent_code', $code)
            ->orderBy('code')
            ->get()
            ->map(fn (TerminologyConcept $c) => $this->serializeRow($c))
            ->all();

        $mappings = TerminologyMapping::where('source', $source)
            ->where('from_code', $code)
            ->get()
            ->map(fn (TerminologyMapping $m) => [
                'id' => $m->id,
                'to_code' => $m->to_code,
                'to_source' => $m->to_source,
                'to_title' => $m->to_title,
                'map_type' => $m->map_type,
            ])
            ->all();

        $parents = [];
        $parentCode = $concept->parent_code;
        $depth = 0;
        while ($parentCode && $depth < 5) {
            $parent = TerminologyConcept::forSource($source)->where('code', $parentCode)->first();
            if (! $parent) break;
            array_unshift($parents, [
                'code' => $parent->code,
                'title' => $parent->title,
            ]);
            $parentCode = $parent->parent_code;
            $depth++;
        }

        return Inertia::render('admin/TerminologyDetail', [
            'concept' => [
                'id' => $concept->id,
                'source' => $concept->source,
                'code' => $concept->code,
                'title' => $concept->title,
                'definition' => $concept->definition,
                'chapter_code' => $concept->chapter_code,
                'chapter_title' => $concept->chapter_title,
                'block_code' => $concept->block_code,
                'block_title' => $concept->block_title,
                'parent_code' => $concept->parent_code,
                'is_leaf' => $concept->is_leaf,
                'synonyms' => $concept->synonyms ?? [],
                'inclusions' => $concept->inclusions ?? [],
                'exclusions' => $concept->exclusions ?? [],
                'indexing_references' => $concept->indexing_references ?? [],
                'raw_data' => $concept->raw_data ?? [],
                'synced_at' => $concept->synced_at?->toIso8601String(),
            ],
            'children' => $children,
            'mappings' => $mappings,
            'parents' => $parents,
        ]);
    }

    public function sync(string $source): RedirectResponse
    {
        if (! isset(config('terminology.sources', [])[$source])) {
            abort(404);
        }

        SyncTerminologySource::dispatch(
            $source,
            Auth::guard('super_admin')->id(),
            'manual',
        );

        AuditLogger::log('terminology.sync.requested', ['source' => $source]);

        return back()->with('success', "Sync queued for {$source}.");
    }

    public function syncAll(): RedirectResponse
    {
        foreach (array_keys(config('terminology.sources', [])) as $source) {
            SyncTerminologySource::dispatch(
                $source,
                Auth::guard('super_admin')->id(),
                'manual',
            );
        }

        AuditLogger::log('terminology.sync_all.requested');

        return back()->with('success', 'Sync queued for all terminology sources.');
    }

    public function syncStatus(string $source): JsonResponse
    {
        $latest = TerminologySyncJob::where('source', $source)
            ->orderByDesc('created_at')
            ->first();

        return response()->json([
            'active' => $latest && in_array($latest->status, ['queued', 'running'], true),
            'status' => $latest?->status,
        ]);
    }

    private function serializeRow(TerminologyConcept $c): array
    {
        return [
            'id' => $c->id,
            'source' => $c->source,
            'code' => $c->code,
            'title' => $c->title,
            'chapter_code' => $c->chapter_code,
            'chapter_title' => $c->chapter_title,
            'block_title' => $c->block_title,
            'is_leaf' => $c->is_leaf,
            'synonyms_count' => count($c->synonyms ?? []),
            'synced_at' => $c->synced_at?->toIso8601String(),
        ];
    }
}
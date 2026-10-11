<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementsPageController extends Controller
{
    public function index(): Response
    {
        $tenant = tenant();

        $announcements = tenancy()->central(function () use ($tenant) {
            return Announcement::query()
                ->where('status', 'published')
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
                })
                ->where(function ($q) use ($tenant) {
                    $q->where('target_type', 'all')
                      ->orWhere(function ($sub) use ($tenant) {
                          $sub->where('target_type', 'tenant')
                              ->whereJsonContains('target_ids', $tenant->id);
                      })
                      ->orWhere(function ($sub) use ($tenant) {
                          $sub->where('target_type', 'plan')
                              ->whereJsonContains('target_ids', $tenant->plan_id);
                      });
                })
                ->orderByDesc('published_at')
                ->paginate(20)
                ->through(fn (Announcement $a) => [
                    'id' => $a->id,
                    'title' => $a->title,
                    'body' => $a->body,
                    'category' => $a->category,
                    'priority' => $a->priority,
                    'published_at' => $a->published_at?->toIso8601String(),
                ]);
        });

        return Inertia::render('tenant/Announcements', [
            'announcements' => $announcements,
        ]);
    }
}

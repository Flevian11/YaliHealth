<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;

class AnnouncementsController extends Controller
{
    public function recent(): JsonResponse
    {
        $tenant = tenant();

        // Announcements live in the central schema
        $items = tenancy()->central(function () use ($tenant) {
            return Announcement::query()
                ->where('status', 'published')
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
                })
                ->where(function ($q) use ($tenant) {
                    // 'all' targeting, or specifically this tenant
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
                ->limit(10)
                ->get()
                ->map(fn (Announcement $a) => [
                    'id' => $a->id,
                    'title' => $a->title,
                    'body' => $a->body,
                    'category' => $a->category,
                    'priority' => $a->priority,
                    'published_at' => $a->published_at?->toIso8601String(),
                ]);
        });

        return response()->json(['announcements' => $items]);
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'plans' => $this->publicPlans(),
        ]);
    }

    public function terms(): Response
    {
        return Inertia::render('marketing/terms');
    }

    public function privacy(): Response
    {
        return Inertia::render('marketing/privacy');
    }

    public function gdpr(): Response
    {
        return Inertia::render('marketing/gdpr');
    }

    public function contact(): Response
    {
        return Inertia::render('marketing/contact');
    }

    public function submitContact(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150'],
            'hospital' => ['nullable', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:40'],
            'subject' => ['required', 'string', 'max:40'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        Log::info('contact.enquiry', $data);

        return back()->with('success', 'Message received.');
    }

    public function careers(): Response
    {
        $positions = collect(config('careers.positions', []))
            ->filter(fn ($p) => ($p['is_open'] ?? true) === true)
            ->sortByDesc('posted_at')
            ->values()
            ->all();

        return Inertia::render('marketing/careers', [
            'positions' => $positions,
            'perks' => config('careers.perks', []),
            'contactEmail' => config('careers.contact_email', 'careers@yalihealth.co.ke'),
        ]);
    }

    public function blog(): Response
    {
        $posts = collect(config('blog.posts', []))
            ->sortByDesc('published_at')
            ->values()
            ->all();

        $categories = collect($posts)
            ->pluck('category')
            ->unique()
            ->sort()
            ->values()
            ->all();

        return Inertia::render('marketing/blog', [
            'posts' => $posts,
            'categories' => $categories,
            'newsletterEmail' => config('blog.newsletter_email', 'blog@yalihealth.co.ke'),
        ]);
    }

    public function blogPost(string $slug): Response
    {
        $posts = collect(config('blog.posts', []));
        $post = $posts->firstWhere('slug', $slug);

        abort_if(! $post, 404);

        $categories = $posts
            ->pluck('category')
            ->unique()
            ->sort()
            ->values()
            ->all();

        return Inertia::render('marketing/blog', [
            'posts' => $posts->sortByDesc('published_at')->values()->all(),
            'categories' => $categories,
            'newsletterEmail' => config('blog.newsletter_email', 'blog@yalihealth.co.ke'),
            'post' => $post,
        ]);
    }

    /**
     * Informational page for hospitals wanting to onboard.
     * No self-registration — the platform admin provisions every tenant.
     */
    public function getStarted(): Response
    {
        return Inertia::render('marketing/get-started');
    }

    private function publicPlans(): array
    {
        return Plan::where('is_active', true)
            ->where('is_public', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Plan $p) => [
                'id' => $p->id,
                'slug' => $p->slug,
                'name' => $p->name,
                'description' => $p->description,
                'billing_cycle' => $p->billing_cycle,
                'billing_cycle_months' => $p->billing_cycle_months,
                'price_monthly' => $p->price_monthly,
                'price_yearly' => $p->price_yearly,
                'setup_fee' => $p->setup_fee,
                'currency' => $p->currency,
                'trial_days' => $p->trial_days,
                'features' => $p->features ?? [],
            ])
            ->all();
    }
}
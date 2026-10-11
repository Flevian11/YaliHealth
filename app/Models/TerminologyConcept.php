<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TerminologyConcept extends Model
{
    protected $fillable = [
        'source', 'code', 'title', 'definition',
        'chapter_code', 'chapter_title',
        'block_code', 'block_title',
        'parent_code', 'is_leaf',
        'synonyms', 'inclusions', 'exclusions', 'indexing_references',
        'raw_data', 'synced_at',
    ];

    protected $casts = [
        'synonyms' => 'array',
        'inclusions' => 'array',
        'exclusions' => 'array',
        'indexing_references' => 'array',
        'raw_data' => 'array',
        'is_leaf' => 'boolean',
        'synced_at' => 'datetime',
    ];

    public function children()
    {
        return $this->hasMany(self::class, 'parent_code', 'code')
            ->where('source', $this->source);
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_code', 'code')
            ->where('source', $this->source);
    }

    public function scopeForSource($q, string $source)
    {
        return $q->where('source', $source);
    }
}
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/**
 * @mixin \App\Models\User
 */
class AuthUserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing('roles.permissions.screen', 'roles.permissions.action');

        $primaryRole = $this->resource->roles->first();

        $roles = $this->resource->roles->map(function ($role) {
            return [
                'id' => (string) $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
            ];
        })->values();

        $permissions = $this->resource->roles
            ->flatMap(function ($role) {
                return $role->permissions->map(function ($permission) {
                    $screen = optional($permission->screen)->slug;
                    $action = optional($permission->action)->slug;

                    if (! $screen || ! $action) {
                        return null;
                    }

                    return [
                        'screen' => $screen,
                        'action' => $action,
                    ];
                });
            })
            ->filter()
            ->groupBy('screen')
            ->map(function (Collection $items, string $screen) {
                return [
                    'screen' => $screen,
                    'actions' => $items
                        ->pluck('action')
                        ->unique()
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();

        return [
            'id' => (string) $this->resource->id,
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            'username' => $this->resource->username,
            'role' => $primaryRole?->slug,
            'roles' => $roles->all(),
            'permissions' => $permissions,
        ];
    }
}

<?php

namespace Database\Seeders;

use App\Models\{Action, Permission, Role, Screen, User};
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class AccessControlSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $roles = collect([
                ['name' => 'Administrador', 'slug' => 'admin'],
                ['name' => 'Gerente', 'slug' => 'manager'],
                ['name' => 'Profissional', 'slug' => 'professional'],
                ['name' => 'Recepcionista', 'slug' => 'receptionist'],
            ])->mapWithKeys(function (array $role) {
                $model = Role::withTrashed()->updateOrCreate(
                    ['slug' => $role['slug']],
                    Arr::only($role, ['name', 'slug'])
                );

                if ($model->trashed()) {
                    $model->restore();
                }

                return [$role['slug'] => $model];
            });

            $screens = collect([
                'dashboard' => 'Dashboard',
                'users' => 'Usuários',
                'roles' => 'Papéis',
                'screens' => 'Telas',
                'actions' => 'Ações',
                'permissions' => 'Permissões',
                'services' => 'Serviços',
                'professionals' => 'Profissionais',
                'customers' => 'Clientes',
                'suppliers' => 'Fornecedores',
                'items' => 'Itens',
                'promotions' => 'Promoções',
                'appointments' => 'Agendamentos',
                'commissions' => 'Comissões',
                'cashier' => 'Caixa',
                'accounts-payable' => 'Contas a pagar',
                'item-prices' => 'Preços de itens',
                'item-price-histories' => 'Histórico de preços de itens',
            ])->map(function (string $name, string $slug) {
                $model = Screen::withTrashed()->updateOrCreate(
                    ['slug' => $slug],
                    ['name' => $name, 'slug' => $slug]
                );

                if ($model->trashed()) {
                    $model->restore();
                }

                return $model;
            })->keyBy('slug');

            $actions = Action::all()->keyBy('slug');

            $permissionsMatrix = [
                'admin' => [
                    'dashboard' => ['read'],
                    'users' => ['read', 'create', 'update', 'delete'],
                    'roles' => ['read', 'create', 'update', 'delete'],
                    'screens' => ['read', 'create', 'update', 'delete'],
                    'actions' => ['read', 'create', 'update', 'delete'],
                    'permissions' => ['read', 'create', 'update', 'delete'],
                    'services' => ['read', 'create', 'update', 'delete'],
                    'professionals' => ['read', 'create', 'update', 'delete'],
                    'customers' => ['read', 'create', 'update', 'delete'],
                    'suppliers' => ['read', 'create', 'update', 'delete'],
                    'items' => ['read', 'create', 'update', 'delete'],
                    'promotions' => ['read', 'create', 'update', 'delete'],
                    'appointments' => ['read', 'create', 'update', 'delete'],
                    'commissions' => ['read', 'create', 'update', 'delete'],
                    'cashier' => ['read', 'create', 'update', 'delete'],
                    'accounts-payable' => ['read', 'create', 'update', 'delete'],
                    'item-prices' => ['read', 'create', 'update', 'delete'],
                    'item-price-histories' => ['read'],
                ],
                'manager' => [
                    'dashboard' => ['read'],
                    'services' => ['read', 'create', 'update', 'delete'],
                    'professionals' => ['read', 'create', 'update', 'delete'],
                    'customers' => ['read', 'create', 'update'],
                    'suppliers' => ['read', 'create', 'update', 'delete'],
                    'items' => ['read', 'create', 'update', 'delete'],
                    'promotions' => ['read', 'create', 'update', 'delete'],
                    'appointments' => ['read', 'create', 'update', 'delete'],
                    'commissions' => ['read', 'update'],
                    'cashier' => ['read', 'create', 'update'],
                    'accounts-payable' => ['read', 'create', 'update', 'delete'],
                    'item-prices' => ['read', 'create', 'update', 'delete'],
                    'item-price-histories' => ['read'],
                ],
                'professional' => [
                    'appointments' => ['read'],
                    'commissions' => ['read'],
                ],
                'receptionist' => [
                    'appointments' => ['read', 'create', 'update'],
                    'customers' => ['read', 'create', 'update'],
                ],
            ];

            foreach ($permissionsMatrix as $roleSlug => $screensPermissions) {
                $role = $roles[$roleSlug];

                foreach ($screensPermissions as $screenSlug => $allowedActions) {
                    $screen = $screens[$screenSlug] ?? null;

                    if (!$screen) {
                        continue;
                    }

                    foreach ($allowedActions as $actionSlug) {
                        $action = $actions[$actionSlug] ?? null;

                        if (!$action) {
                            continue;
                        }

                        Permission::firstOrCreate([
                            'role_id' => $role->id,
                            'screen_id' => $screen->id,
                            'action_id' => $action->id,
                        ]);
                    }
                }
            }

            $credentials = [
                'admin' => [
                    [
                        'name' => 'Michele',
                        'username' => 'michele',
                        'email' => 'michele@yazolabs.com',
                        'password' => 'admin123',
                    ],
                    [
                        'name' => 'Symon',
                        'username' => 'symon',
                        'email' => 'symon@yazolabs.com',
                        'password' => 'admin123',
                    ],
                    [
                        'name' => 'Jammily',
                        'username' => 'jammily',
                        'email' => 'jammily@yazolabs.com',
                        'password' => 'admin123',
                    ],
                    [
                        'name' => 'Melissa',
                        'username' => 'melissa',
                        'email' => 'melissa@yazolabs.com',
                        'password' => 'admin123',
                    ],
                    [
                        'name' => 'Yazo',
                        'username' => 'yazo',
                        'email' => 'yazo@yazolabs.com',
                        'password' => 'yazo12',
                    ],
                ],

                'professional' => [
                    [
                        'name' => 'Carla',
                        'username' => 'carla',
                        'email' => 'carla@yazolabs.com',
                        'password' => '123456',
                    ],
                    [
                        'name' => 'Maria',
                        'username' => 'maria',
                        'email' => 'maria@yazolabs.com',
                        'password' => '123456',
                    ],
                    [
                        'name' => 'Agela',
                        'username' => 'agela',
                        'email' => 'agela@yazolabs.com',
                        'password' => '123456',
                    ],
                    [
                        'name' => 'Thay',
                        'username' => 'thay',
                        'email' => 'thay@yazolabs.com',
                        'password' => '123456',
                    ],
                    [
                        'name' => 'Claudia',
                        'username' => 'claudia',
                        'email' => 'claudia@yazolabs.com',
                        'password' => '123456',
                    ],
                    [
                        'name' => 'Geluce',
                        'username' => 'geluce',
                        'email' => 'geluce@yazolabs.com',
                        'password' => '123456',
                    ],
                    
                ],
            ];

            foreach ($credentials as $roleSlug => $users) {
                foreach ($users as $data) {
                    $user = User::updateOrCreate(
                        ['email' => $data['email']],
                        Arr::only($data, ['name', 'username', 'email', 'password'])
                    );

                    $user->roles()->syncWithoutDetaching([$roles[$roleSlug]->id]);
                }
            }

        });
    }
}

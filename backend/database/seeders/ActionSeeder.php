<?php

namespace Database\Seeders;

use App\Models\Action;
use Illuminate\Database\Seeder;

class ActionSeeder extends Seeder
{
    public function run(): void
    {
        $actions = [
            ['name' => 'Criar',         'slug' => 'create'],
            ['name' => 'Visualizar',    'slug' => 'read'],
            ['name' => 'Atualizar',     'slug' => 'update'],
            ['name' => 'Excluir',       'slug' => 'delete'],
        ];

        foreach ($actions as $action) {
            Action::create($action);
        }
    }
}

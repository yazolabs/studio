<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $servicesByCategory = [
            'CABELO' => [
                'Progressiva',
                'Selagem',
                'Botox',
                'Design de corte',
                'Lavagem',
                'Tratamento',
                'Luzes',
                'Definição',
                'Cronograma capilar',
            ],
            'TRANÇA' => [
                'Penteado 1/3',
                'Penteado topo',
                'Penteado cabeça toda',
                'Fulani braids s/ cachos',
                'Fulani braids c/ cachos',
                'Box braids s/ cachos',
                'Box braids c/ cachos',
                'Crochet braids',
                'Boho braids',
                'Twist braids',
                'Locs braids',
            ],
            'UNHAS' => [
                'Unhas em gel na tip',
                'Unhas em gel na fibra',
                'Unhas em gel no F1',
                'Manutenção de gel na tip',
                'Manutenção na fibra',
                'Manutenção de gel no F1',
                'Blindagem',
                'Postiça',
                'Remoção de gel',
                'Cutilagem',
                'Pedicure',
                'Manicure pé e mão',
                'Plástica dos pés',
                'Spa dos pés',
                'Escalda pés',
                'Hidromassagem',
            ],
            'SOBRANCELHA' => [
                'Design personalizado',
                'Design c/ henna',
                'Design c/ coloração',
                'Brow lamination',
                'Lash lifting',
                'Buço',
                'Mento',
                'Cílios',
            ],
            'ESTÉTICA' => [
                'Massagem relaxante',
                'Massagem podal',
                'Ventosaterapia',
                'Epilação meia perna',
                'Epilação perna completa',
                'Axila',
                'Virilha',
                'Íntimo completo',
                'Limpeza de pele',
            ],
        ];

        foreach ($servicesByCategory as $category => $services) {
            foreach ($services as $name) {
                Service::firstOrCreate(
                    ['name' => $name],
                    [
                        'description'       => $name,
                        'price'             => 0,
                        'duration'          => 60, 
                        'category'          => $category,
                        'commission_type'   => 'percentage', 
                        'commission_value'  => 0,
                        'active'            => true,
                    ]
                );
            }
        }
    }
}

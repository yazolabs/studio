<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Professional;
use App\Models\Service;
use App\Models\User;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudioSampleDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $faker = Faker::create('pt_BR');

            if (Customer::count() === 0) {
                for ($i = 0; $i < 20; $i++) {
                    Customer::create([
                        'name'               => $faker->name(),
                        'cpf'                => $faker->numerify('###.###.###-##'),
                        'gender'             => $faker->randomElement(['F', 'M']),
                        'active'             => true,
                        'email'              => $faker->unique()->safeEmail(),
                        'phone'              => $faker->numerify('8199########'),
                        'alternate_phone'    => null,
                        'address'            => $faker->streetName(),
                        'number'             => $faker->buildingNumber(),
                        'complement'         => null,
                        'neighborhood'       => $faker->streetName(),
                        'city'               => 'Recife',
                        'state'              => 'PE',
                        'zip_code'           => $faker->numerify('#####-###'),
                        'birth_date'         => $faker->dateTimeBetween('-60 years', '-18 years'),
                        'last_visit'         => $faker->dateTimeBetween('-6 months', 'now'),
                        'notes'              => $faker->boolean(30) ? $faker->sentence() : null,
                        'contact_preferences'=> ['whatsapp'],
                        'accepts_marketing'  => $faker->boolean(70),
                    ]);
                }
            }

            $customers = Customer::all();
            if ($customers->isEmpty()) {
                return;
            }

            $serviceDefinitions = [
                [
                    'name'        => 'Manicure Simples',
                    'description' => 'Cutilagem e esmaltação tradicional.',
                    'price'       => 35.00,
                    'duration'    => 40,
                    'category'    => 'Mãos',
                    'commission_value' => 40.00,
                ],
                [
                    'name'        => 'Pedicure Simples',
                    'description' => 'Cutilagem e esmaltação dos pés.',
                    'price'       => 40.00,
                    'duration'    => 45,
                    'category'    => 'Pés',
                    'commission_value' => 40.00,
                ],
                [
                    'name'        => 'Manicure + Pedicure',
                    'description' => 'Combo mãos e pés.',
                    'price'       => 65.00,
                    'duration'    => 80,
                    'category'    => 'Combo',
                    'commission_value' => 40.00,
                ],
                [
                    'name'        => 'Alongamento em Gel',
                    'description' => 'Aplicação completa de alongamento em gel.',
                    'price'       => 150.00,
                    'duration'    => 120,
                    'category'    => 'Alongamento',
                    'commission_value' => 50.00,
                ],
                [
                    'name'        => 'Manutenção Alongamento',
                    'description' => 'Manutenção de alongamento em gel/fibra.',
                    'price'       => 110.00,
                    'duration'    => 90,
                    'category'    => 'Alongamento',
                    'commission_value' => 50.00,
                ],
                [
                    'name'        => 'Spa dos Pés',
                    'description' => 'Esfoliação, hidratação e massagem relaxante.',
                    'price'       => 70.00,
                    'duration'    => 60,
                    'category'    => 'Pés',
                    'commission_value' => 40.00,
                ],
                [
                    'name'        => 'Design de Sobrancelha',
                    'description' => 'Limpeza e modelagem das sobrancelhas.',
                    'price'       => 35.00,
                    'duration'    => 30,
                    'category'    => 'Sobrancelha',
                    'commission_value' => 40.00,
                ],
                [
                    'name'        => 'Design com Henna',
                    'description' => 'Design e aplicação de henna.',
                    'price'       => 45.00,
                    'duration'    => 40,
                    'category'    => 'Sobrancelha',
                    'commission_value' => 40.00,
                ],
                [
                    'name'        => 'Lash Lifting',
                    'description' => 'Lifting e tintura dos cílios.',
                    'price'       => 120.00,
                    'duration'    => 75,
                    'category'    => 'Olhos',
                    'commission_value' => 50.00,
                ],
                [
                    'name'        => 'Sobrancelha + Lash Combo',
                    'description' => 'Design de sobrancelha + lash lifting.',
                    'price'       => 150.00,
                    'duration'    => 90,
                    'category'    => 'Combo',
                    'commission_value' => 50.00,
                ],
            ];

            foreach ($serviceDefinitions as $data) {
                Service::updateOrCreate(
                    ['name' => $data['name']],
                    [
                        'description'      => $data['description'],
                        'price'            => $data['price'],
                        'duration'         => $data['duration'],
                        'category'         => $data['category'],
                        'commission_type'  => 'percentage',
                        'commission_value' => $data['commission_value'],
                        'active'           => true,
                    ]
                );
            }

            $services = Service::whereIn('name', array_column($serviceDefinitions, 'name'))->get();
            if ($services->isEmpty()) {
                return;
            }

            $professionalUsers = User::whereHas('roles', function ($q) {
                $q->where('slug', 'professional');
            })->get();

            if ($professionalUsers->isEmpty()) {
                return;
            }

            $defaultSchedule = [
                'monday'    => ['start' => '09:00', 'end' => '18:00'],
                'tuesday'   => ['start' => '09:00', 'end' => '18:00'],
                'wednesday' => ['start' => '09:00', 'end' => '18:00'],
                'thursday'  => ['start' => '09:00', 'end' => '18:00'],
                'friday'    => ['start' => '09:00', 'end' => '18:00'],
                'saturday'  => ['start' => '08:00', 'end' => '14:00'],
                'sunday'    => null,
            ];

            $specialtiesPool = [
                'Manicure',
                'Pedicure',
                'Alongamento',
                'Sobrancelha',
                'Lash Lifting',
                'Spa dos Pés',
            ];

            $professionals = collect();

            foreach ($professionalUsers as $user) {
                $professionals->push(
                    Professional::firstOrCreate(
                        ['user_id' => $user->id],
                        [
                            'phone'         => $faker->numerify('8198#######'),
                            'specialties'   => $faker->randomElements(
                                $specialtiesPool,
                                $faker->numberBetween(1, 3)
                            ),
                            'active'        => true,
                            'work_schedule' => $defaultSchedule,
                        ]
                    )
                );
            }

            if ($professionals->isEmpty()) {
                return;
            }

            $statuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled'];
            $paymentMethods = ['cash', 'credit', 'debit', 'pix'];
            $cardBrands = ['Visa', 'Mastercard', 'Elo', 'Hipercard'];

            $timeSlots = [];
            for ($hour = 8; $hour <= 18; $hour++) {
                for ($minute = 0; $minute < 60; $minute += 30) {
                    if ($hour === 18 && $minute > 0) {
                        break;
                    }
                    $timeSlots[] = sprintf('%02d:%02d:00', $hour, $minute);
                }
            }

            $baseDate = now()->startOfDay();

            for ($i = 0; $i < 37; $i++) {
                $customer = $customers->random();
                $date = $baseDate->copy()->addDays($faker->numberBetween(-7, 7));
                $startTime = $faker->randomElement($timeSlots);

                $selectedServices = $services->random($faker->numberBetween(1, 3));
                if ($selectedServices instanceof Service) {
                    $selectedServices = collect([$selectedServices]);
                }

                $totalDuration = (int) $selectedServices->sum('duration');
                $totalPrice = (float) $selectedServices->sum('price');

                $status = $faker->randomElement($statuses);
                $paymentMethod = $faker->randomElement($paymentMethods);

                $installments = $paymentMethod === 'credit'
                    ? $faker->numberBetween(1, 3)
                    : 1;

                $installmentFeePercent = $paymentMethod === 'credit'
                    ? $faker->randomElement([0, 1.99, 2.99, 3.49])
                    : 0;

                $discountPercent = $faker->randomElement([0, 0, 0, 5, 10]);
                $discountAmount = round($totalPrice * $discountPercent / 100, 2);
                $partialTotal = $totalPrice - $discountAmount;
                $installmentFeeAmount = $installmentFeePercent > 0
                    ? round($partialTotal * $installmentFeePercent / 100, 2)
                    : 0;
                $finalPrice = $partialTotal + $installmentFeeAmount;

                $appointment = Appointment::create([
                    'customer_id'     => $customer->id,
                    'date'            => $date->toDateString(),
                    'start_time'      => $startTime,
                    'end_time'        => null,
                    'duration'        => $totalDuration,
                    'status'          => $status,
                    'total_price'     => $totalPrice,
                    'discount_amount' => $discountAmount,
                    'final_price'     => $finalPrice,
                    'payment_method'  => $paymentMethod,
                    'card_brand'      => $paymentMethod === 'credit'
                        ? $faker->randomElement($cardBrands)
                        : null,
                    'installments'    => $installments,
                    'installment_fee' => $installmentFeePercent,
                    'promotion_id'    => null,
                    'notes'           => $faker->boolean(40) ? $faker->sentence() : null,
                ]);

                foreach ($selectedServices as $service) {
                    /** @var \App\Models\Service $service */
                    $professional = $professionals->random();

                    $appointment->services()->attach($service->id, [
                        'service_price'     => $service->price,
                        'commission_type'   => $service->commission_type ?? 'percentage',
                        'commission_value'  => $service->commission_value ?? 0,
                        'professional_id'   => $professional->id,
                    ]);
                }
            }
        });
    }
}

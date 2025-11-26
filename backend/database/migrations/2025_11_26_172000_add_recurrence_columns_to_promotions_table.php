<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->boolean('is_recurring')
                ->default(false)
                ->after('active');
            $table->string('recurrence_type', 32)
                ->nullable()
                ->after('is_recurring');
            $table->json('recurrence_weekdays')
                ->nullable()
                ->after('recurrence_type');
            $table->unsignedTinyInteger('recurrence_week_of_month')
                ->nullable()
                ->after('recurrence_weekdays');
            $table->unsignedTinyInteger('recurrence_month')
                ->nullable()
                ->after('recurrence_week_of_month');
            $table->unsignedTinyInteger('recurrence_day_of_month')
                ->nullable()
                ->after('recurrence_month');
        });
    }

    public function down(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->dropColumn([
                'is_recurring',
                'recurrence_type',
                'recurrence_weekdays',
                'recurrence_week_of_month',
                'recurrence_month',
                'recurrence_day_of_month',
            ]);
        });
    }
};

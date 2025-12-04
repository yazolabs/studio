<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointment_service', function (Blueprint $table) {
            $table->dateTime('starts_at')
                ->nullable()
                ->after('commission_value');
            $table->dateTime('ends_at')
                ->nullable()
                ->after('starts_at');
            $table->index(
                ['professional_id', 'starts_at', 'ends_at'],
                'appointment_service_prof_time_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('appointment_service', function (Blueprint $table) {
            $table->dropIndex('appointment_service_prof_time_idx');
            $table->dropColumn(['starts_at', 'ends_at']);
        });
    }
};

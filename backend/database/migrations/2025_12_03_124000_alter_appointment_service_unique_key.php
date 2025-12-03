<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('appointment_service', function (Blueprint $table) {
            $table->dropForeign(['appointment_id']);
            $table->dropForeign(['service_id']);
            $table->dropForeign(['professional_id']);
            $table->dropUnique('appointment_service_unique');
        });

        Schema::table('appointment_service', function (Blueprint $table) {
            $table->foreign('appointment_id')
                ->references('id')
                ->on('appointments')
                ->cascadeOnDelete();
            $table->foreign('service_id')
                ->references('id')
                ->on('services')
                ->cascadeOnDelete();
            $table->foreign('professional_id')
                ->references('id')
                ->on('professionals')
                ->nullOnDelete();
            $table->unique(
                ['appointment_id', 'service_id', 'professional_id', 'starts_at'],
                'appointment_service_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('appointment_service', function (Blueprint $table) {
            $table->dropForeign(['appointment_id']);
            $table->dropForeign(['service_id']);
            $table->dropForeign(['professional_id']);
            $table->dropUnique('appointment_service_unique');
        });

        Schema::table('appointment_service', function (Blueprint $table) {
            $table->foreign('appointment_id')
                ->references('id')
                ->on('appointments')
                ->cascadeOnDelete();
            $table->foreign('service_id')
                ->references('id')
                ->on('services')
                ->cascadeOnDelete();
            $table->foreign('professional_id')
                ->references('id')
                ->on('professionals')
                ->nullOnDelete();
            $table->unique(
                ['appointment_id', 'service_id', 'professional_id'],
                'appointment_service_unique'
            );
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('commissions', function (Blueprint $table) {
            $table->unsignedBigInteger('appointment_service_id')
                ->nullable()
                ->after('service_id');
            $table->index('appointment_service_id', 'commissions_appointment_service_id_idx');
            $table->foreign('appointment_service_id', 'commissions_appointment_service_id_fk')
                ->references('id')
                ->on('appointment_service')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('commissions', function (Blueprint $table) {
            $table->dropForeign('commissions_appointment_service_id_fk');
            $table->dropIndex('commissions_appointment_service_id_idx');
            $table->dropColumn('appointment_service_id');
        });
    }
};

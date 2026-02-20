<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('account_payables', function (Blueprint $table) {
            $table->foreignId('commission_id')
                ->nullable()
                ->after('appointment_id')
                ->constrained('commissions')
                ->nullOnDelete();

            $table->index('commission_id');
        });
    }

    public function down(): void
    {
        Schema::table('account_payables', function (Blueprint $table) {
            $table->dropConstrainedForeignId('commission_id');
        });
    }
};

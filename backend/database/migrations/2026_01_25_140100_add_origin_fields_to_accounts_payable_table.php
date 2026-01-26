<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('accounts_payable', function (Blueprint $table) {
            $table->string('origin_type', 50)
                ->nullable()
                ->after('appointment_id');
            $table->unsignedBigInteger('origin_id')
                ->nullable()
                ->after('origin_type');
            $table->index(['origin_type', 'origin_id'], 'accounts_payable_origin_idx');
        });
    }

    public function down(): void
    {
        Schema::table('accounts_payable', function (Blueprint $table) {
            $table->dropIndex('accounts_payable_origin_idx');
            $table->dropColumn(['origin_type', 'origin_id']);
        });
    }
};

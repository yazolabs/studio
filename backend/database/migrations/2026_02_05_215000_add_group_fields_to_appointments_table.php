<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->uuid('group_id')->nullable()->after('id')->index();
            $table->unsignedSmallInteger('group_sequence')->nullable()->after('group_id');

            $table->index(['group_id', 'group_sequence']);
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['appointments_group_id_group_sequence_index']);
            $table->dropColumn(['group_id', 'group_sequence']);
        });
    }
};

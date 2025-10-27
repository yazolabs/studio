<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained()->onDelete('cascade');
            $table->foreignId('screen_id')->constrained()->onDelete('cascade');
            $table->foreignId('action_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['role_id', 'screen_id', 'action_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};

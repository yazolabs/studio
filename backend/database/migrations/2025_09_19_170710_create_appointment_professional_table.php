<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('appointment_professional', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('professional_id')->constrained()->cascadeOnDelete();
            $table->decimal('commission_percentage', 5, 2)->nullable();
            $table->decimal('commission_fixed', 12, 2)->nullable();
            $table->timestamps();

            $table->unique(['appointment_id', 'professional_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_professional');
    }
};

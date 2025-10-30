<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('professionals', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->string('email', 160)->nullable();
            $table->string('phone', 40)->nullable();
            $table->json('specialties')->nullable();
            $table->boolean('active')->default(true);
            $table->json('work_schedule')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('email');
            $table->index('active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('professionals');
    }
};

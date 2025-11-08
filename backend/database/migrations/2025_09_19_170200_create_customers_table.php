<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();

            $table->string('name', 160);
            $table->string('cpf', 14)->nullable();
            $table->string('gender', 20)->default('not_informed');
            $table->boolean('active')->default(true);

            $table->string('email', 160)->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('alternate_phone', 40)->nullable();

            $table->string('address', 255)->nullable();
            $table->string('number', 20)->nullable();
            $table->string('complement', 120)->nullable();
            $table->string('neighborhood', 120)->nullable();
            $table->string('city', 120)->nullable();
            $table->string('state', 60)->nullable();
            $table->string('zip_code', 20)->nullable();

            $table->date('birth_date')->nullable();
            $table->timestamp('last_visit')->nullable();
            $table->text('notes')->nullable();

            $table->json('contact_preferences')->nullable();
            $table->boolean('accepts_marketing')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['name']);
            $table->index(['city']);
            $table->index(['state']);
            $table->index(['active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};

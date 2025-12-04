<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('professional_open_windows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamps();

            $table->index(
                ['professional_id', 'start_date', 'end_date'],
                'pow_prof_start_end_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('professional_open_windows');
    }
};

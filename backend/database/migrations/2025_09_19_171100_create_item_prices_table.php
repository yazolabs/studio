<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('item_prices', function (Blueprint $table) {
            $table->increments('id');
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->decimal('price', 12, 2);
            $table->decimal('cost', 12, 2)->nullable();
            $table->decimal('margin', 5, 2)->nullable();
            $table->date('effective_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['item_id', 'effective_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_prices');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('appointment_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->decimal('price', 12, 2);
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();

            $table->unique(['appointment_id', 'item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_item');
    }
};

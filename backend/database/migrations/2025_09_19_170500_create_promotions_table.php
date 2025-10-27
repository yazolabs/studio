<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 160);
            $table->text('description')->nullable();
            $table->string('discount_type', 20);
            $table->decimal('discount_value', 12, 2);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('active')->default(true);
            $table->decimal('min_purchase_amount', 12, 2)->nullable();
            $table->decimal('max_discount', 12, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('active');
            $table->index(['start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};

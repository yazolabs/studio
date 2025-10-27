<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cashier_transactions', function (Blueprint $table) {
            $table->increments('id');
            $table->date('date');
            $table->string('type', 20);
            $table->string('category', 80);
            $table->string('description', 255)->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('payment_method', 60)->nullable();
            $table->string('reference', 160)->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['date', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cashier_transactions');
    }
};

<?php

namespace App\Enums;

enum TransactionType: string
{
    case Income = 'entrada';
    case Expense = 'saida';
}

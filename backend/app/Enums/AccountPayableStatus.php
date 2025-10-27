<?php

namespace App\Enums;

enum AccountPayableStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Overdue = 'overdue';
}

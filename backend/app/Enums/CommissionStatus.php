<?php

namespace App\Enums;

enum CommissionStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
}

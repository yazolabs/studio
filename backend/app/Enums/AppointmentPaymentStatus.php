<?php

namespace App\Enums;

enum AppointmentPaymentStatus: string
{
    case Unpaid = 'unpaid';
    case Prepaid = 'prepaid';
    case Paid = 'paid';
}

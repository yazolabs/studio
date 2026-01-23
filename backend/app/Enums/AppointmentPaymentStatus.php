<?php

namespace App\Enums;

enum AppointmentPaymentStatus: string
{
    case Unpaid = 'unpaid';
    case Prepaid = 'prepaid';
    case Paid = 'paid';
}

// vamos agora ajustar os arquivos relacionados à appoitments no front (como service, page, etc...), e depois ajustamos o controller no backend, os métodos store/update.
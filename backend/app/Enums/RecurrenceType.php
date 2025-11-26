<?php

namespace App\Enums;

enum RecurrenceType: string
{
    case NONE = 'none';
    case WEEKLY = 'weekly';
    case MONTHLY_NTH_WEEKDAY = 'monthly_nth_weekday';
    case YEARLY_FIXED_DATE = 'yearly_fixed_date';
    case YEARLY_NTH_WEEKDAY_IN_MONTH = 'yearly_nth_weekday_in_month';
}

<?php
/**
 * Form handler settings. This file is blocked from public access by .htaccess.
 * Create the mailboxes below in Namecheap cPanel → Email Accounts first.
 */
return [
    // Where form submissions are delivered
    'to'        => 'info@elastrongcaresfoundation.org',
    // Must be an address on your own domain, or mail may be flagged as spam
    'from'      => 'no-reply@elastrongcaresfoundation.org',
    'site_name' => 'Elastrong Cares Foundation',

    // Also keep a CSV copy of every submission in forms/storage/ (download it via cPanel File Manager)
    'store_csv' => true,

    // Basic abuse protection
    'min_seconds_to_submit' => 3,   // bots submit instantly
    'max_per_ip_per_hour'   => 8,
];

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StudioSampleDataSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/sql/studio_db.sql');

        if (!file_exists($path)) {
            $this->command?->error("Arquivo SQL não encontrado em: {$path}");
            return;
        }

        $this->importSqlDump($path);
    }

    private function importSqlDump(string $path): void
    {
        $skipTables = [
            'migrations',
            'password_reset_tokens',
            'personal_access_tokens',
            'failed_jobs',
            'job_batches',
            'jobs',
            'cache',
            'cache_locks',
            'sessions',
            'telescope_entries',
            'telescope_entries_tags',
            'telescope_monitoring',
        ];

        $sql = file_get_contents($path);
        $sql = $this->stripSqlComments($sql);

        $statements = $this->splitSqlStatements($sql);

        $tablesInDump = [];
        foreach ($statements as $st) {
            $table = $this->extractInsertTable($st);
            if (!$table) continue;
            if (in_array($table, $skipTables, true)) continue;
            $tablesInDump[$table] = true;
        }
        $tablesInDump = array_keys($tablesInDump);

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        try {
            foreach ($tablesInDump as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->truncate();
                }
            }

            foreach ($statements as $st) {
                $st = trim($st);
                if ($st === '') continue;

                if (stripos($st, 'INSERT INTO') !== 0) {
                    continue;
                }

                $table = $this->extractInsertTable($st);
                if (!$table) continue;

                if (in_array($table, $skipTables, true)) {
                    continue;
                }

                DB::unprepared($st . ';');
            }
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    private function extractInsertTable(string $sql): ?string
    {
        if (!preg_match('/^INSERT\s+INTO\s+`?([a-zA-Z0-9_]+)`?/i', ltrim($sql), $m)) {
            return null;
        }
        return $m[1] ?? null;
    }

    private function stripSqlComments(string $sql): string
    {
        $sql = preg_replace('~/\*.*?\*/~s', '', $sql) ?? $sql;

        $lines = preg_split("/(\r\n|\n|\r)/", $sql);
        $out = [];
        foreach ($lines as $line) {
            $trim = ltrim($line);
            if (str_starts_with($trim, '--')) continue;
            if (str_starts_with($trim, '/*!')) continue;
            $out[] = $line;
        }
        return implode("\n", $out);
    }

    private function splitSqlStatements(string $sql): array
    {
        $statements = [];
        $buffer = '';

        $inSingle = false;
        $inDouble = false;
        $escape = false;

        $len = strlen($sql);
        for ($i = 0; $i < $len; $i++) {
            $ch = $sql[$i];

            if ($escape) {
                $buffer .= $ch;
                $escape = false;
                continue;
            }

            if ($ch === "\\") {
                $buffer .= $ch;
                $escape = true;
                continue;
            }

            if ($ch === "'" && !$inDouble) {
                $inSingle = !$inSingle;
                $buffer .= $ch;
                continue;
            }

            if ($ch === '"' && !$inSingle) {
                $inDouble = !$inDouble;
                $buffer .= $ch;
                continue;
            }

            if ($ch === ';' && !$inSingle && !$inDouble) {
                $statements[] = trim($buffer);
                $buffer = '';
                continue;
            }

            $buffer .= $ch;
        }

        if (trim($buffer) !== '') {
            $statements[] = trim($buffer);
        }

        return $statements;
    }
}

<?php

namespace App\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\{Builder, Model};

abstract class BaseService
{
    abstract protected function model(): string;

    protected function newQuery(): Builder
    {
        $modelClass = $this->model();

        /** @var Model $modelClass */
        return $modelClass::query();
    }

    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['perPage'] ?? 15);
        $query = $this->newQuery();

        if (! empty($params['search']) && method_exists($this, 'applySearch')) {
            $this->applySearch($query, (string) $params['search']);
        }

        return $query->paginate($perPage)->appends($params);
    }

    public function listAll(array $params = [])
    {
        $query = $this->newQuery();

        if (! empty($params['search']) && method_exists($this, 'applySearch')) {
            $this->applySearch($query, (string) $params['search']);
        }

        return $query->get();
    }

    public function create(array $data): Model
    {
        $modelClass = $this->model();

        return $modelClass::create($data);
    }

    public function update(Model $model, array $data): Model
    {
        $model->fill($data);
        $model->save();

        return $model;
    }

    public function delete(Model $model): void
    {
        $model->delete();
    }
}

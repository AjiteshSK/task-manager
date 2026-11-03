import { useState } from 'react';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { useDebouncedCallback } from '../../lib/use-debounced-callback';
import type { TaskListParams } from '../../lib/types';
import { PRIORITY_LABELS, SORT_LABELS, STATUS_LABELS, toOptions } from './task-labels';
import type { TaskFilterName } from './use-task-filters';

interface TaskFiltersProps {
  params: TaskListParams;
  onFilterChange: (name: TaskFilterName, value: string) => void;
}

const statusOptions = [{ value: '', label: 'All statuses' }, ...toOptions(STATUS_LABELS)];
const priorityOptions = [{ value: '', label: 'All priorities' }, ...toOptions(PRIORITY_LABELS)];
const sortOptions = toOptions(SORT_LABELS);

export function TaskFilters({ params, onFilterChange }: TaskFiltersProps) {
  // The box updates on every key; the URL (and so the request) only after a 300ms pause
  const [searchText, setSearchText] = useState(params.search ?? '');
  const updateSearch = useDebouncedCallback(
    (value: string) => onFilterChange('search', value.trim()),
    300,
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <TextField
        label="Search"
        type="search"
        placeholder="Search by title"
        value={searchText}
        onChange={(event) => {
          setSearchText(event.target.value);
          updateSearch(event.target.value);
        }}
      />
      <SelectField
        label="Status"
        options={statusOptions}
        value={params.status ?? ''}
        onChange={(event) => onFilterChange('status', event.target.value)}
      />
      <SelectField
        label="Priority"
        options={priorityOptions}
        value={params.priority ?? ''}
        onChange={(event) => onFilterChange('priority', event.target.value)}
      />
      <SelectField
        label="Sort by"
        options={sortOptions}
        value={params.sort}
        onChange={(event) => onFilterChange('sort', event.target.value)}
      />
    </div>
  );
}

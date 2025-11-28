
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTables, addTable, updateTable, deleteTable } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { RestaurantTable } from '../../types';
import { AlertCircle, Trash2, Table, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useSettings } from '../../hooks/use-settings';

const AdminTables: React.FC = () => {
  const queryClient = useQueryClient();
  const { canManageTables } = useAuth();
  const { t } = useSettings();
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableSeats, setNewTableSeats] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tables, isLoading } = useQuery<RestaurantTable[]>({
    queryKey: ['tables'],
    queryFn: getTables,
  });

  const addMutation = useMutation({
    mutationFn: (data: { table_number: number; seats: number }) => addTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['allTables'] }); 
      setNewTableNumber('');
      setNewTableSeats('');
      setError(null);
    },
    onError: (err: any) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTable(id),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tables'] });
        queryClient.invalidateQueries({ queryKey: ['allTables'] });
        setDeleteId(null);
        setError(null);
    },
    onError: (err: any) => {
        setError(err.message || t('common.error_generic'));
        setDeleteId(null);
    }
  });

  if (!canManageTables) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-neutral-400">
            <Lock size={48} className="mb-4 text-gold-500" />
            <h2 className="text-2xl font-bold text-neutral-200">Access Restricted</h2>
            <p>You do not have permission to manage tables.</p>
        </div>
    );
  }

  const handleAdd = () => {
    if (!newTableNumber || !newTableSeats) {
        setError(t('booking.error_fill_details'));
        return;
    }
    addMutation.mutate({
        table_number: parseInt(newTableNumber),
        seats: parseInt(newTableSeats)
    });
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
        deleteMutation.mutate(deleteId);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-100 font-serif mb-1">{t('dashboard.manage_tables')}</h1>
        <p className="text-neutral-400">{t('dashboard.manage_tables_desc')}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} />
            <span>{error}</span>
        </div>
      )}

      {/* Add Table Section */}
      <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-neutral-100 mb-4 flex items-center gap-2">
            <Table size={18} className="text-gold-500"/>
            {t('dashboard.manage_tables')}
        </h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
             <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">{t('dashboard.table_number')}</label>
                <Input 
                    placeholder="e.g. 10" 
                    type="number"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    className="bg-dark-900"
                />
             </div>
             <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">{t('dashboard.number_of_seats')}</label>
                <Input 
                    placeholder="e.g. 4" 
                    type="number"
                    value={newTableSeats}
                    onChange={(e) => setNewTableSeats(e.target.value)}
                    className="bg-dark-900"
                />
             </div>
             <Button onClick={handleAdd} disabled={addMutation.isPending} className="w-full md:w-auto h-10 shadow-lg shadow-gold-500/10">
                {addMutation.isPending ? t('common.processing') : t('dashboard.add_table')}
             </Button>
        </div>
      </div>

      {/* Table List */}
      <div className="rounded-xl border border-dark-700 overflow-hidden">
         {isLoading ? (
             <div className="p-8 text-center text-neutral-500">{t('common.loading')}</div>
         ) : (
            <table className="w-full text-left text-sm">
                <thead className="bg-dark-800/80 text-neutral-400 font-medium border-b border-dark-700">
                    <tr>
                        <th className="p-4 pl-6">{t('dashboard.table_number')}</th>
                        <th className="p-4">{t('dashboard.col_size')}</th>
                        <th className="p-4 pr-6 text-right">{t('dashboard.col_actions')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50 bg-dark-900/30">
                    {tables?.map((table) => (
                        <EditableTableRow 
                            key={table.id} 
                            table={table} 
                            onDelete={() => setDeleteId(table.id)}
                        />
                    ))}
                    {tables?.length === 0 && (
                        <tr>
                            <td colSpan={3} className="p-8 text-center text-neutral-500">
                                No tables found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
         )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title={t('dashboard.delete_table')}
        message={t('dashboard.delete_table_msg')}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

const EditableTableRow: React.FC<{ table: RestaurantTable; onDelete: () => void }> = ({ table, onDelete }) => {
    const queryClient = useQueryClient();
    const { t } = useSettings();
    const [seats, setSeats] = useState(table.seats.toString());
    const [isDirty, setIsDirty] = useState(false);

    const updateMutation = useMutation({
        mutationFn: (newSeats: number) => updateTable(table.id, { seats: newSeats }),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['tables'] });
             queryClient.invalidateQueries({ queryKey: ['allTables'] });
             setIsDirty(false);
        }
    });

    const handleUpdate = () => {
        updateMutation.mutate(parseInt(seats));
    };

    return (
        <tr className="hover:bg-dark-800/30 transition-colors">
            <td className="p-4 pl-6 font-medium text-neutral-200">
                {table.table_number}
            </td>
            <td className="p-4">
                <input 
                    type="number"
                    value={seats}
                    onChange={(e) => {
                        setSeats(e.target.value);
                        setIsDirty(true);
                    }}
                    className="w-20 bg-dark-800 border border-dark-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:border-gold-500 outline-none transition-colors"
                />
            </td>
            <td className="p-4 pr-6 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button 
                        onClick={handleUpdate}
                        disabled={!isDirty || updateMutation.isPending}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                            isDirty 
                             ? 'bg-gold-500 text-dark-900 border-gold-500 hover:bg-gold-400' 
                             : 'bg-gold-500/10 text-gold-500/50 border-gold-500/10 cursor-not-allowed'
                        }`}
                    >
                        {updateMutation.isPending ? t('common.processing') : t('common.save')}
                    </button>
                    <button 
                        onClick={onDelete}
                        className="px-3 py-1.5 rounded-md border transition-colors text-xs font-medium bg-red-600/10 text-red-500 border-red-600/20 hover:bg-red-600/20"
                    >
                        {t('common.delete')}
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default AdminTables;

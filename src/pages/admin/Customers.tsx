
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filterCustomers, addCustomer, updateCustomer, deleteCustomer } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Input } from '../../components/ui/Input';
import { Customer } from '../../types';
import { Trash2, AlertCircle, Search, Phone, Edit2, FileText, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useSettings } from '../../hooks/use-settings';

const ZaloIcon = ({ className, size = "1em" }: { className?: string; size?: number | string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <path d="M10 10C10 6.68629 12.6863 4 16 4H32C35.3137 4 38 6.68629 38 10V32C38 35.3137 35.3137 38 32 38H16C12.6863 38 10 35.3137 10 32V10Z" fill="currentColor" fillOpacity="0.2"/>
    <path d="M28.5 16H19V19.5H25.5L19 28.5V32H29V28.5H22.5L29 19.5V16H28.5Z" fill="currentColor"/>
  </svg>
);

const WhatsAppIcon = ({ className, size = "1em" }: { className?: string; size?: number | string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={size} height={size}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const AdminCustomers: React.FC = () => {
  const queryClient = useQueryClient();
  const { canManageCustomers, isSuperAdmin } = useAuth();
  const { t } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [formData, setFormData] = useState({ 
    first_name: '', 
    last_name: '', 
    phone: '', 
    email: '', 
    status: 'regular' 
  });

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: filterCustomers
  });

  const addMutation = useMutation({
    mutationFn: addCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleClose();
    },
    onError: (err: any) => {
        if (err.code === '23514' || err.message?.includes('violates check constraint')) {
            setError(t('common.db_restriction'));
        } else {
            setError(err.message);
        }
    }
  });

  const updateMutation = useMutation({
    mutationFn: (variables: { id: string, data: Partial<Customer> }) => updateCustomer(variables.id, variables.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['dailyBookings'] });
      handleClose();
    },
    onError: (err: any) => {
        if (err.code === '23514' || err.message?.includes('violates check constraint')) {
            setError(t('common.db_restriction'));
        } else {
            setError(err.message);
        }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['dailyBookings'] });
      setCustomerToDelete(null);
      setError(null);
    },
    onError: (err: any) => {
      setCustomerToDelete(null);
      if (err.message?.includes('foreign key constraint') || err.message?.includes('23503')) {
        setError(t('common.db_fk_error'));
      } else {
        setError(err.message || t('common.error_generic'));
      }
    }
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ first_name: '', last_name: '', phone: '', email: '', status: 'regular' });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ 
      first_name: customer.first_name, 
      last_name: customer.last_name, 
      phone: customer.phone,
      email: customer.email || '',
      status: customer.status
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setError(null);
  };

  const handleSubmit = () => {
    if (editingCustomer?.id) {
      updateMutation.mutate({ id: editingCustomer.id, data: formData as any });
    } else {
      addMutation.mutate(formData as any);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const openZalo = (phone: string) => {
     const cleanPhone = phone.replace(/\D/g, '');
     window.open(`https://zalo.me/${cleanPhone}`, '_blank');
  };

  const filteredCustomers = customers?.filter(customer => {
    const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(filterText.toLowerCase()) || customer.phone.includes(filterText);
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    // Security: Hide Super Admin customers from non-Super Admins
    if (!isSuperAdmin && customer.status === 'super_admin') {
        return false;
    }

    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <div className="p-8 text-center text-neutral-500">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div>
            <h1 className="text-3xl font-bold text-neutral-100 font-serif mb-1">{t('dashboard.manage_customers')}</h1>
            <p className="text-neutral-400">{t('dashboard.manage_customers_desc')}</p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between gap-4 items-end md:items-center">
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                    <input 
                        type="text"
                        placeholder={t('dashboard.filter_by_name')}
                        className="bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-gold-500 outline-none min-w-[240px] w-full md:w-auto"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
                 <select 
                    className="bg-dark-900 border border-dark-700 rounded-lg px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-gold-500 cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                 >
                    <option value="all">{t('dashboard.all_customers')}</option>
                    <option value="regular">{t('dashboard.status_regular')}</option>
                    <option value="vip">{t('dashboard.status_vip')}</option>
                    <option value="admin">{t('dashboard.status_admin')}</option>
                    {isSuperAdmin && <option value="super_admin">{t('dashboard.status_super_admin')}</option>}
                 </select>
            </div>
            {/* Only Show Add Button if permission allows */}
            {canManageCustomers && (
              <Button onClick={handleOpenAdd} className="whitespace-nowrap shadow-lg shadow-gold-500/10">
                  <Plus size={18} className="mr-2" />
                  {t('dashboard.add_new_customer')}
              </Button>
            )}
        </div>
      </div>

      {error && !isModalOpen && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 text-red-500 text-sm animate-in fade-in">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
                <span className="font-bold block mb-1">{t('common.error_generic')}</span>
                {error}
            </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-dark-700 bg-dark-800/30">
        <table className="w-full text-left text-sm">
            <thead className="bg-dark-800/80 text-neutral-400 font-medium border-b border-dark-700">
                <tr>
                    <th className="p-4 pl-6 font-medium">{t('common.first_name')} / {t('common.last_name')}</th>
                    <th className="p-4 font-medium">{t('common.phone')}</th>
                    <th className="p-4 font-medium">{t('common.email')}</th>
                    <th className="p-4 font-medium">{t('dashboard.col_account')}</th>
                    <th className="p-4 font-medium">{t('common.status')}</th>
                    <th className="p-4 pr-6 font-medium text-right">{t('dashboard.col_actions')}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
                {filteredCustomers?.map((customer) => (
                    <tr key={customer.id} className="hover:bg-dark-700/30 transition-colors group">
                        <td className="p-4 pl-6 font-medium text-neutral-100">
                            {customer.first_name} {customer.last_name}
                        </td>
                        <td className="p-4 font-mono text-xs text-neutral-300">
                            {customer.phone}
                        </td>
                        <td className="p-4 text-neutral-400">
                            {customer.email || <span className="text-neutral-600">-</span>}
                        </td>
                        <td className="p-4">
                            {customer.user_id ? (
                                <span className="text-neutral-300 font-medium">Yes</span>
                            ) : (
                                <span className="text-neutral-600">No</span>
                            )}
                        </td>
                        <td className="p-4">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${
                                customer.status === 'vip' 
                                    ? 'bg-gold-500/10 text-gold-500 border-gold-500/20' 
                                    : customer.status === 'admin'
                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                    : customer.status === 'super_admin'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : 'bg-dark-700/50 text-neutral-400 border-dark-600'
                             }`}>
                                {customer.status === 'super_admin' ? t('dashboard.status_super_admin') : t(`dashboard.status_${customer.status}`)}
                            </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                                {canManageCustomers && (
                                  <button 
                                      onClick={() => handleOpenEdit(customer)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gold-500/10 text-gold-500 hover:bg-gold-500/20 border border-gold-500/20 transition-colors text-xs font-medium"
                                  >
                                      {t('common.edit')}
                                  </button>
                                )}
                                <button onClick={() => openWhatsApp(customer.phone)} className="p-1.5 rounded-md bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 transition-colors"><WhatsAppIcon size={18} /></button>
                                <button onClick={() => openZalo(customer.phone)} className="p-1.5 rounded-md bg-[#0068FF]/10 text-[#0068FF] hover:bg-[#0068FF]/20 border border-[#0068FF]/20 transition-colors"><ZaloIcon size={22} /></button>
                                
                                {canManageCustomers && (
                                  <>
                                    <div className="w-px h-4 bg-dark-700 mx-1"></div>
                                    <button 
                                        onClick={() => setCustomerToDelete(customer)}
                                        className="p-1.5 rounded-md border transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleClose} title={editingCustomer ? t('common.edit') : t('dashboard.add_new_customer')}>
        <div className="space-y-4">
          {error && (
             <div className="bg-red-500/10 p-3 rounded-lg flex items-start gap-2 text-red-500 text-sm border border-red-500/20">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label={t('common.first_name')} value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
            <Input label={t('common.last_name')} value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
          </div>
          <Input label={t('common.phone')} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} startIcon={<Phone size={16} />} />
          <Input label={t('common.email')} type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-400">{t('common.status')}</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
              className="w-full rounded-md border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-neutral-100 focus:ring-2 focus:ring-gold-500 outline-none"
            >
              <option value="regular">{t('dashboard.status_regular')}</option>
              <option value="vip">{t('dashboard.status_vip')}</option>
              <option value="admin">{t('dashboard.status_admin')}</option>
              {isSuperAdmin && <option value="super_admin">{t('dashboard.status_super_admin')}</option>}
            </select>
          </div>
          <Button onClick={handleSubmit} className="w-full mt-2">
            {editingCustomer ? t('common.save') : t('dashboard.add_new_customer')}
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={t('dashboard.delete_customer_title')}
        message={t('dashboard.delete_customer_msg').replace('{name}', `${customerToDelete?.first_name} ${customerToDelete?.last_name}`)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminCustomers;

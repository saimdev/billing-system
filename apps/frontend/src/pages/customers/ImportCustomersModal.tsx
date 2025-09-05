import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, Label } from '@/components/ui/Form';
import { customersApi } from '../../services/api';
import toast from 'react-hot-toast';

interface ImportCustomersModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportCustomersModal({ onClose, onSuccess }: ImportCustomersModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const result = await customersApi.bulkImport(file);
      toast.success(`Imported ${result.imported} customers successfully`);
      if (result.failed > 0) {
        toast.error(`${result.failed} customers failed to import`);
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Import Customers
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload a CSV or Excel file with customer data
        </p>
      </div>

      <FormField>
        <Label htmlFor="file">Choose File</Label>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 dark:text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />
      </FormField>

      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          File Format Requirements
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Required columns: name, phone</li>
          <li>• Optional columns: email, cnic, address, city, state</li>
          <li>• First row should contain column headers</li>
          <li>• Supported formats: CSV, Excel (.xlsx, .xls)</li>
        </ul>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleImport}
          loading={importing}
          disabled={!file}
        >
          Import Customers
        </Button>
      </div>
    </div>
  );
}
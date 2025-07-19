// src/pages/backup/BackupRestore.js
import React, { useState, useEffect } from 'react';
import backupAPI from '../../api/backup';
import { Button } from '../../components/common/Button'; // Ensure this import is correct
import Loading from '../../components/common/Loading'; // Import Loading component
import { toast } from 'react-toastify'; // Import toast for notifications

const BackupRestore = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadBackupHistory();
  }, []);

  const loadBackupHistory = async () => {
    setLoading(true);
    try {
      const response = await backupAPI.getBackupHistory();
      setBackups(response.backups || []);
    } catch (err) {
      toast.error('Failed to load backup history.');
      console.error('Failed to load backup history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      await backupAPI.createBackup();
      toast.success('Backup created successfully!');
      loadBackupHistory();
    } catch (err) {
      toast.error('Failed to create backup.');
      console.error('Failed to create backup:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedFile) {
      toast.warn('Please select a backup file to restore.');
      return;
    }

    setLoading(true);
    try {
      await backupAPI.restoreBackup(selectedFile);
      toast.success('Backup restored successfully!');
      setSelectedFile(null);
      // Reset file input
      document.getElementById('backup-file').value = '';
      loadBackupHistory(); // Reload history after successful restore
    } catch (err) {
      toast.error('Failed to restore backup.');
      console.error('Failed to restore backup:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const blob = await backupAPI.downloadBackup(filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Backup downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download backup.');
      console.error('Failed to download backup:', err);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Backup & Restore Management</h1>

      {loading && <Loading />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Create Backup */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create New Backup</h2>
          <p className="text-gray-600 mb-6">
            Generate a fresh backup of all your critical application data, including products, customers, and sales records.
          </p>
          <Button
            onClick={handleCreateBackup}
            disabled={loading}
            loading={loading}
            className="w-full"
            variant="primary"
            size="large"
          >
            Create Backup
          </Button>
        </div>

        {/* Restore Backup */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Restore Data From Backup</h2>
          <p className="text-gray-600 mb-6">
            Upload a backup file to restore your application data. This will overwrite existing data.
          </p>
          <div className="mb-6">
            <input
              id="backup-file"
              type="file"
              accept=".json,.zip,.enc" // Added .enc for encrypted backups
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
          {selectedFile && (
            <p className="text-base text-gray-700 mb-6">
              Selected file: <span className="font-semibold">{selectedFile.name}</span>
            </p>
          )}
          <Button
            onClick={handleRestoreBackup}
            disabled={loading || !selectedFile}
            loading={loading}
            className="w-full"
            variant="secondary"
            size="large"
          >
            Restore Backup
          </Button>
        </div>
      </div>

      {/* Backup History */}
      <div className="mt-10 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Backup History</h2>
        {loading && backups.length === 0 ? (
          <Loading /> // Show loading specifically for history table if no data yet
        ) : backups.length === 0 ? (
          <p className="text-gray-600 text-lg py-8 text-center">No backup history found. Create your first backup!</p>
        ) : (
          <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Backup Date</th>
                  <th scope="col" className="px-6 py-3">File Name</th>
                  <th scope="col" className="px-6 py-3">Size</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {new Date(backup.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {backup.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {backup.size || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        onClick={() => handleDownload(backup.filename)}
                        variant="info"
                        size="small"
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupRestore;
export { BackupRestore };
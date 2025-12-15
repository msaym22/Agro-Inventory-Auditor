const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const backupsDir = path.resolve(__dirname, '..', '..', (process.env.BACKUP_DIR || 'backups'));
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Image upload configuration (existing functionality)
const imageFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp|bmp|heic|heif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image\/(jpeg|jpg|png|gif|webp|bmp|heic|heif)/.test(file.mimetype.toLowerCase());

  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only! Allowed: jpg, jpeg, png, gif, webp, bmp, heic, heif'));
  }
};

// Backup file upload configuration
const backupFileFilter = (req, file, cb) => {
  // Allow our encrypted backups (.enc), plus common data formats
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = ['.enc', '.json', '.csv', '.sql', '.xlsx', '.xls'];
  const extname = allowedExt.includes(ext);
  const mimetype = [
    'application/octet-stream',
    'application/json',
    'text/csv',
    'application/sql',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ].includes((file.mimetype || '').toLowerCase());

  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only backup files (.enc, JSON, CSV, SQL, Excel) are allowed!'));
  }
};

const imageUpload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFilter
});

// Dedicated storage for backups -> write directly to backups directory
const backupStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, backupsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.enc';
    cb(null, `backup-${uniqueSuffix}${ext}`);
  }
});

const backupUpload = multer({
  storage: backupStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for backup files
  fileFilter: backupFileFilter
});

// Excel file upload configuration
const excelFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = ['.xlsx', '.xls'];
  const extname = allowedExt.includes(ext);
  const mimetype = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream'
  ].includes((file.mimetype || '').toLowerCase());

  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'));
  }
};

const excelUpload = multer({
  storage: storage, // Use the same storage as images (uploads directory)
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for Excel files
  fileFilter: excelFileFilter
});

module.exports = {
  imageUpload,
  backupUpload,
  excelUpload,
  uploadsDir,
  backupsDir,
};
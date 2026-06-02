#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks if all required components are installed and configured
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class SetupVerifier {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.results = [];
    }

    log(status, message) {
        const icon = status === 'OK' ? '✓' : status === 'WARN' ? '⚠' : '✗';
        const color = status === 'OK' ? '\x1b[32m' : status === 'WARN' ? '\x1b[33m' : '\x1b[31m';
        console.log(`${color}${icon}\x1b[0m ${message}`);
        this.results.push({ status, message });
    }

    async checkNode() {
        try {
            const { stdout } = await execAsync('node --version');
            this.log('OK', `Node.js ${stdout.trim()} installed`);
        } catch {
            this.log('ERROR', 'Node.js not installed. Install from https://nodejs.org/');
        }
    }

    async checkPython() {
        try {
            const { stdout } = await execAsync('python --version');
            this.log('OK', `${stdout.trim()} installed`);
        } catch {
            try {
                const { stdout } = await execAsync('python3 --version');
                this.log('OK', `${stdout.trim()} installed`);
            } catch {
                this.log('ERROR', 'Python not installed. Install from https://www.python.org/');
            }
        }
    }

    checkFiles() {
        const requiredFiles = [
            'Backend/app.js',
            'Backend/package.json',
            'Backend/routes/detection.js',
            'Backend/services/detection-manager.js',
            'Backend/utils/logging.js',
            'Backend/public/js/analyze-integrated.js',
            'Backend/views/analyze.ejs',
            'src/Detection/detection_service.py',
            'src/Config/config.py',
            'requirements.txt',
            'artifacts/drowsiness_model.h5'
        ];

        console.log('\n📁 Checking Files:');
        
        requiredFiles.forEach(file => {
            const fullPath = path.join(this.projectRoot, file);
            if (fs.existsSync(fullPath)) {
                this.log('OK', `${file}`);
            } else {
                this.log('ERROR', `${file} (MISSING)`);
            }
        });
    }

    checkDirectories() {
        const requiredDirs = [
            'Backend',
            'Backend/routes',
            'Backend/services',
            'Backend/utils',
            'Backend/public',
            'Backend/public/js',
            'Backend/views',
            'src',
            'src/Detection',
            'src/Config',
            'logs'
        ];

        console.log('\n📂 Checking Directories:');
        
        requiredDirs.forEach(dir => {
            const fullPath = path.join(this.projectRoot, dir);
            if (fs.existsSync(fullPath)) {
                this.log('OK', `${dir}`);
            } else {
                this.log('WARN', `${dir} (missing, will be created)`);
            }
        });
    }

    checkPackages() {
        console.log('\n📦 Checking Node.js Packages:');
        
        const packageJsonPath = path.join(this.projectRoot, 'Backend', 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const nodeModulesPath = path.join(this.projectRoot, 'Backend', 'node_modules');
            if (fs.existsSync(nodeModulesPath)) {
                this.log('OK', 'Node modules installed');
            } else {
                this.log('WARN', 'Node modules not installed. Run: cd Backend && npm install');
            }
        }
    }

    checkPythonPackages() {
        console.log('\n🐍 Checking Python Packages:');
        
        const requiredPackages = [
            'tensorflow',
            'opencv',
            'flask',
            'requests'
        ];

        this.log('WARN', 'Run: pip install -r requirements.txt');
    }

    checkEnvFile() {
        console.log('\n⚙️  Checking Configuration:');
        
        const envPath = path.join(this.projectRoot, 'Backend', '.env');
        if (fs.existsSync(envPath)) {
            this.log('OK', '.env file exists');
            
            const content = fs.readFileSync(envPath, 'utf8');
            if (content.includes('ALARM_THRESHOLD')) {
                this.log('OK', 'Detection settings configured');
            }
        } else {
            this.log('ERROR', '.env file not found');
        }
    }

    checkPort() {
        console.log('\n🔌 Port Availability:');
        
        // Port check would require actual connection attempt
        this.log('WARN', 'Ports 5000 (Node.js) and 5001 (Python) must be available');
    }

    async run() {
        console.clear();
        console.log('========================================');
        console.log('   Driver Drowsiness Detection Setup');
        console.log('   Verification Script');
        console.log('========================================\n');

        console.log('🔍 Checking Prerequisites:');
        await this.checkNode();
        await this.checkPython();

        this.checkFiles();
        this.checkDirectories();
        this.checkPackages();
        this.checkPythonPackages();
        this.checkEnvFile();
        this.checkPort();

        // Summary
        console.log('\n========================================');
        const ok = this.results.filter(r => r.status === 'OK').length;
        const total = this.results.length;
        console.log(`✓ Verification Complete: ${ok}/${total} checks passed`);
        console.log('========================================\n');

        // Next steps
        console.log('📋 Next Steps:');
        console.log('1. cd Backend');
        console.log('2. npm install');
        console.log('3. pip install -r ../requirements.txt');
        console.log('4. Update Backend/.env with your settings');
        console.log('5. npm run dev');
        console.log('\n🌐 Access: http://localhost:5000\n');
    }
}

const verifier = new SetupVerifier();
verifier.run().catch(err => console.error(err));

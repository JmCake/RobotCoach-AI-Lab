import {defineConfig} from '@playwright/test';
const baseURL=`http://127.0.0.1:${process.env.PORT||4180}`;
export default defineConfig({testDir:'./tests/e2e',timeout:60000,expect:{timeout:12000},fullyParallel:false,workers:1,reporter:'list',use:{baseURL,trace:'retain-on-failure',launchOptions:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}},webServer:{command:'npm run dev',url:baseURL,reuseExistingServer:!process.env.CI,timeout:15000}});

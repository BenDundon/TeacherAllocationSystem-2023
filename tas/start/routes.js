'use strict';

const AcademicController = require('../app/Controllers/Http/AcademicController');

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */

const Helpers = use('Helpers');
const Route = use('Route');
const ExcelJS = require('exceljs');
const ImportController = require('../app/Controllers/Http/ImportController');
const ExportController = require('../app/Controllers/Http/ExportController');

Route.get('/', ({ view }) => {
  return view.render('home');
});

//allocations
Route.get('/allocations', 'AllocationController.render').middleware(['auth']);
Route.post('/allocations', 'AllocationController.render').middleware(['auth']);
Route.post(
  '/allocations/addallocation',
  'AllocationController.addAllocation',
).middleware(['auth']);
Route.post(
  '/allocations/updateallocation',
  'AllocationController.updateAllocation',
).middleware(['auth']);
Route.post(
  '/allocations/deleteallocation',
  'AllocationController.deleteallocation',
).middleware(['auth']);

Route.post(
  '/allocations/scoreallocation', 
  'AllocationController.scoreAllocation'
).middleware(['auth']);


//academics
Route.get('/academics', 'AcademicController.render').middleware(['auth']);
Route.post('/academics', 'AcademicController.render').middleware(['auth']);
Route.post(
  '/academics/addacademic',
  'AcademicController.addacademic',
).middleware(['auth']);
Route.post(
  '/academics/updateacademic',
  'AcademicController.updateacademic',
).middleware(['auth']);
Route.post(
  '/academics/deleteacademic',
  'AcademicController.deleteacademic',
).middleware(['auth']);
Route.post(
  '/academics/addPreference',
  'AcademicController.addPreference',
).middleware(['auth']);
Route.post(
  '/academics/deletePreference',
  'AcademicController.deletePreference',
).middleware(['auth']);
Route.post(
  '/academics/updatePreference',
  'AcademicController.updatePreference',
).middleware(['auth']);

//units
Route.get('/units', 'UnitController.render').middleware(['auth']);
Route.post('/units', 'UnitController.render').middleware(['auth']);
Route.post('/units/addunit', 'UnitController.addunit').middleware(['auth']);
Route.post('/units/updateunit', 'UnitController.updateunit').middleware([
  'auth',
]);
Route.post('/units/deleteunit', 'UnitController.deleteunit').middleware([
  'auth',
]);
Route.post('/units/addoffering', 'UnitController.addoffering').middleware([
  'auth',
]);
Route.post('/units/updateoffering', 'UnitController.updateoffering').middleware(
  ['auth'],
);
Route.post('/units/deleteoffering', 'UnitController.deleteoffering').middleware(
  ['auth'],
);

// File handling
Route.post('/export', 'ExportController.render').middleware(['auth']);
Route.get('/import', ({ view }) => {
  return view.render('import');
}).middleware(['auth']);
Route.get('/export', 'ExportController.render').middleware(['auth']);
Route.get('/exportSheet', 'ExportController.export').middleware(['auth']);
Route.put('upload', 'ImportController.uploadFile');

// Spreadsheet View
Route.get('/spreadsheetView', 'SpreadsheetViewController.render').middleware([
  'auth',
]);
Route.post(
  '/spreadsheetView',
  'SpreadsheetViewController.updateTable',
).middleware(['auth']);

// UserController Routes
Route.post('/auth/login', 'UserController.login');
Route.post('/auth/signup', 'UserController.signup');
Route.get('/auth/signout', 'UserController.signout');

// Help page
Route.get('/help', ({ view }) => {
  return view.render('help');
}).middleware(['auth']);

// Unauthenticated views
Route.get('/signup', ({ view }) => {
  return view.render('signup');
});
Route.get('/login', ({ view }) => {
  return view.render('login');
});

// Teaching Preference Form Page
Route.get('/preference_form', 'PreferenceFormController.displayForm');
Route.post('/preference_form', 'PreferenceFormController.updatePreferences');
Route.get(
  '/preference_form/success',

  'PreferenceFormController.displaySuccessPage',
);
Route.get(
  '/preference_form/failure',

  'PreferenceFormController.displayFailurePage',
);

// Data Visualisation Page
Route.get('/dashboard', 'DashboardController.displayDashboard').middleware([
  'auth',
]);

// Error pages
Route.get('/401', ({ view }) => {
  return view.render('401');
});
Route.get('/404', ({ view }) => {
  return view.render('404');
});
Route.get('/error', ({ view }) => {
  return view.render('error');
});

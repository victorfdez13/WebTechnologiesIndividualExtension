<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\SongController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\PlaylistController;

// Songs
Route::get('/songs', [SongController::class, 'index']);
Route::get('/songs/favorites', [SongController::class, 'getFavorites']);
Route::post('/songs', [SongController::class, 'store']);
Route::patch('/songs/{id}/favorite', [SongController::class, 'toggleFavorite']);
Route::delete('/songs/{id}', [SongController::class, 'destroy']);

// Songs - Protected mutations
Route::middleware('auth')->group(function () {
    Route::put('/songs/{id}', [SongController::class, 'update'])->middleware('admin.api');
});

// Stats
Route::get('/stats', [StatsController::class, 'index']);

// Playlists
Route::get('/playlists', [PlaylistController::class, 'index']);
Route::get('/playlists/{id}', [PlaylistController::class, 'show']);

// Playlists - Protected mutations
Route::middleware('auth')->group(function () {
    Route::post('/playlists', [PlaylistController::class, 'store']);
    Route::delete('/playlists/{id}', [PlaylistController::class, 'destroy']);
    Route::post('/playlists/{id}/add-song', [PlaylistController::class, 'addSong']);
    Route::post('/playlists/{id}/remove-song', [PlaylistController::class, 'removeSong']);
});

Route::get('/user/role', function() {
    return response()->json([
        'role' => session('user_role', 'user')
    ]);
}); 

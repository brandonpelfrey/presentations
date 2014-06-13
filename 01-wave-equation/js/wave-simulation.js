
// A 2D grid of floating point values.
// Field 'n' : The resolution on both sides of the grid
var Grid = function (n) {
    var i;
    
    this.data = [];
    this.n = n;
    for(i=0; i<n*n; ++i) { this.data.push( 0.0 ); }
};

Grid.prototype = {
    // Read a value from cell (i,j) (both in the range [0,n)). 
    // No checks on bounds
    read: function (i, j) {
        return this.data[j*this.n + i];   
    },
    
    // Write 'value' to cell (i,j) (both i and j in the range [0,n)).
    // No checks on bounds
    write: function (i, j, value) {
        this.data[j*this.n + i] = value;
    }
};

// A simple 2D simulation of the wave equation using finite differences
var WaveSimulation = function(n, sigma) {
    // Grid resolution
    this.n = n || 64; 
    // Wave speed
    this.sigma = sigma || 1.0;
    // Storage for new and old grids
    this.grids = [ new Grid(this.n), new Grid(this.n) ];
    // Which of our two grids is the older one (the one we will overwrite)
    this.currentGrid = 0;
};

WaveSimulation.prototype = {
    // Step forward in the simulation by 'dt' amount of time
    step: function (dt) {
        var i, j, n = this.n, newValue, Lij;
        
        // This is the grid representing the previous frame
        var recentGrid = this.grids[ 1 - this.currentGrid ];
        
        // The grid representing the values on the grid before the previous frame.
        // We will read from this grid and then overwrite it with the next frame's data
        var olderGrid = this.grids[ this.currentGrid ];
        
        // Precompute some constants that we need to scale the laplacian by.
        // Remember, 'sigma' is essentially related to the speed of the wave
        var alpha = dt * dt * this.sigma;
        
        // For each of the interior cells in the grid...
        for (i=1; i<n-1; ++i) {
            for (j=1; j<n-1; ++j) {
                // Compute the value of the Laplacian at cell (i,j) using the basic finite difference
                Lij = recentGrid.read(i+1,j) + recentGrid.read(i-1,j) + recentGrid.read(i,j+1) + recentGrid.read(i,j-1) - 4.0 * recentGrid.read(i,j);
                
                // Compute the value of this cell for the next frame using the current and previous frame
                newValue = 2 * recentGrid.read(i, j) - olderGrid.read(i,j) + alpha * Lij;
                
                // Since we won't need olderGrid[i,j] anymore, we will actually overwrite its value 
                // so that it holds the data for the next frame
                olderGrid.write(i, j, newValue);
            }
        }
        
        // Now that we've finished updating this grid, flip current for the next frame
        this.currentGrid = 1 - this.currentGrid;
    },
    
    writeToCanvas: function (canvasElement) {
        var context = canvasElement.getContext('2d');
        var canvasWidth = context.canvas.width;
        var canvasHeight = context.canvas.height;
        
        var canvasImageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
        var data = canvasImageData.data;
        var simGrid = this.grids[ 1 - this.currentGrid ];
        
        var i, j, n = this.n, color, index;
        for (i=0; i<n; ++i) {
            for (j=0; j<n; ++j) {
                color = (simGrid.read(i,j) + 1) * 0.5;
                color = color * color;
                color = color * 255 | 0;
                color = color < 0 ? 0 : color > 255 ? 255 : color;
                index = 4 * (j*canvasWidth + i);
                data[ index + 0 ] = color;
                data[ index + 1 ] = color;
                data[ index + 2 ] = color;
                data[ index + 3 ] = 255;
            }
        }
        
        context.putImageData(canvasImageData, 0, 0);
    },
    
    // "Clear" the grids in the simulation, setting all cells in the simulation domain to zero.
    clearGrid: function() {
        var i, j, n = this.n;
        for (i=0; i<n; ++i) {
            for (j=0; j<n; ++j) {
                this.grids[0].write(i, j, 0.0);
                this.grids[1].write(i, j, 0.0);
            }
        }
    },

    // Start the simulation and trigger a step in the simulation every 60th of a second
    start: function() {
        this.clearGrid();
        
        this.interval = setInterval( function() { 
            waveSimulation.step(1); 
            waveSimulation.writeToCanvas (demoCanvas);
        }, 1000.0 / 60 );
        
        this.grids[0].write(64, 128, 4);    
    },
    
    // Kill the currently running simulation
    stop: function() {
        clearInterval (this.clearInterval);
    }
};

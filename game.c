#define tps 1
#define simulationSpeed 3600 * 6
#define GRAVITY_CONST 6.7e-11
#define AU 150e9

#define ParticlesArr 700

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <unistd.h>
#include <math.h>

float randomBetween(float min, float max) {
    return (max - min) * ((float)rand() / RAND_MAX) + min;
}

typedef struct Particle {
    float x, y, mass, velocity_x, velocity_y;
    int radius;
} Particle;

void moveParticle(Particle particle) {
    particle.x += particle.velocity_x * simulationSpeed;
    particle.y += particle.velocity_y * simulationSpeed;
}

void addParticleImpulse(Particle particle, float x, float y) {
    particle.velocity_x += x;
    particle.velocity_y += y;
}

int main() {
    srand(time(NULL));
    
    Particle particles[ParticlesArr];
    
    for(int i = 0; i < ParticlesArr; i++) {
        particles[i].x = randomBetween(-4e9, 4e9);
        particles[i].y = randomBetween(-4e9, 4e9);
        particles[i].radius = 1e3;
        particles[i].velocity_x = 0;
        particles[i].velocity_y = 1e5;
    }
    
    clock_t start = clock(),
            end;
    
    while(1) {
        
        end = clock();
        printf("%f\n", 1000 / ((double)(end - start) / CLOCKS_PER_SEC * 1000));
        start = clock();
        
        for(int i = 0; i < ParticlesArr; i++) {
            for(int j = 0; j < ParticlesArr; j++) {
                if(i == j) continue;
                
                float vec_x = particles[j].x - particles[i].x,
                    vec_y = particles[j].y - particles[i].y,
                    gravityForce = GRAVITY_CONST * particles[i].mass * particles[j].mass / (float)(pow(vec_x, 2) + pow(vec_y, 2)),
                    velocity_x = sin(atan2(vec_x, vec_y)) * gravityForce / particles[i].mass * simulationSpeed,
                    velocity_y = cos(atan2(vec_x, vec_y)) * gravityForce / particles[i].mass * simulationSpeed;

                addParticleImpulse(particles[i], velocity_x, velocity_y);
            }
        }
        
        for(int i = 0; i < ParticlesArr; i++) moveParticle(particles[i]);
        
        // printf("%d\n", tps);
        
        // usleep(1e6 / tps);
    }

    return 0;
}
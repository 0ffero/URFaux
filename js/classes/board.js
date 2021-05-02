class boardPiece {
    constructor(_id, _x, _y, _z) {
        this.id = 'boardPiece_' + _id;
        this.x = _x;
        this.y = _y + ((_id*2) * multiplier);
        this.z = _z;
        this.currentSpeed = 0;
        this.sandHitPlayed = false;
        this._newMesh();
    }

    _newMesh() {
        this.mesh = new THREE.Mesh( geometryBoardPiece, material );
        this.mesh.name = this.id;
        this.mesh.position.x = this.x; this.mesh.position.y = this.y; this.mesh.position.z = this.z;
        this.mesh.castShadow = true; this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}

class playerPiece {
    constructor(player, counter) {
        this.id = 'p' + player + '_counter_' + counter;
        if (player==1) { 
            this.player=1; this.x = 10; this.y=17 + (counter*1);
        } else { 
            this.player=2; this.x = 30; this.y=17 + (counter*1);
        }
        this.z = 50;
        this.scale = 1;
        this.shape = arcShape;
        this.mesh='';
        this._createAndAddMesh();
    }
    
    _createAndAddMesh() {
        if (this.player==1) { this.playerMaterial=playerMaterialWhite; } else { this.playerMaterial=playerMaterialBlack; }
        this.mesh = new THREE.Mesh( geometryPlayerPiece, this.playerMaterial );
        this.mesh.name = this.id;
        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.rotation.set(90*(Math.PI/180), 0, 0);
        this.mesh.scale.set(this.scale, this.scale, this.scale);
        this.mesh.castShadow = true; this.mesh.receiveShadow = true;
        this.mesh.visible = false;
        scene.add(this.mesh);
    }
}
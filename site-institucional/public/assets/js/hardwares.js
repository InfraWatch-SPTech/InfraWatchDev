let dadosUsuario = dadosUser();
let idEmpresa = dadosUsuario.idEmpresa;

function buscarEquipamentosEmpresa(idEmpresa) {
    fetch(`/hardwares/buscarEq/${idEmpresa}`, { cache: 'no-store' })
        .then(function (response) {
            if (response.ok) {
                response.json().then(function (equipamentos) {
                    console.log(equipamentos);
                });
            }
        })
        .catch(function (error) {
            console.error(`Erro na obtenção dos equipamentos: ${error.message}`);
        });
}

buscarEquipamentosEmpresa(idEmpresa);

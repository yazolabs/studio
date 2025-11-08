import axios from 'axios';

export async function getAddressByCep(cep: string) {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  const { data } = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
  if (data.erro) return null;

  return {
    zip_code: data.cep,
    address: data.logradouro,
    complement: data.complemento,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
  };
}

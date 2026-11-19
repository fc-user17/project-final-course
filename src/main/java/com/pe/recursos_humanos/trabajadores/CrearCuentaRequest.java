
package com.pe.recursos_humanos.trabajadores;

public class CrearCuentaRequest {

    private String email;
    private String password;

    public CrearCuentaRequest() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

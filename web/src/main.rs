use askama::Template;
use axum::{
    Json, Router,
    response::{Html, IntoResponse, Response},
    routing::get,
};
use serde::Serialize;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/_internal_/healthcheck", get(healthcheck_handler))
        .route("/", get(index));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    println!("Server Started on :8080");
    axum::serve(listener, app).await.unwrap();
}

#[derive(Serialize)]
struct HealthcheckResponse {
    status: &'static str,
}

async fn healthcheck_handler() -> Json<HealthcheckResponse> {
    let res = HealthcheckResponse { status: "healthy" };
    Json(res)
}

async fn index() -> Response {
    let html_string = HomeTemplate {}.render().unwrap();
    Html(html_string).into_response()
}

#[derive(Template)]
#[template(path = "home.html")]
struct HomeTemplate {}

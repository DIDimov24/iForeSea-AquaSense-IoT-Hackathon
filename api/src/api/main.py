from fastapi import FastAPI

app = FastAPI(title="bloom-api")


@app.get("/hello")
def hello():
    return {"message": "hello"}

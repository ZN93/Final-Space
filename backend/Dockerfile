FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

COPY src src

RUN ./mvnw clean package -DskipTests


FROM eclipse-temurin:17-jre-jammy AS runtime

WORKDIR /app

RUN groupadd -r finalspace && useradd -r -g finalspace finalspace

COPY --from=build /app/target/*.jar app.jar

RUN chown -R finalspace:finalspace /app

USER finalspace

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
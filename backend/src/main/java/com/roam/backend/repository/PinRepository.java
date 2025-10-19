package com.roam.backend.repository;

import com.roam.backend.model.Pin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PinRepository extends JpaRepository<Pin, Long> {

    @Query(value = """
        SELECT * FROM pins
        WHERE earth_distance(
            ll_to_earth(:lat, :lng),
            ll_to_earth(lat, lng)
        ) < :radius
        """, nativeQuery = true)
    List<Pin> findAllWithinRadius(@Param("lat") double lat,
                                  @Param("lng") double lng,
                                  @Param("radius") double radius);
}
